import { supabase } from '../../../shared-auth-foundation/src/js/supabaseClient.js'
import {
    getUserById,
    createUserProfile,
    getVendorProfileByUserId
} from '../../../shared-auth-foundation/src/js/authHelpers.js'

const message = document.getElementById('message')

document.addEventListener('DOMContentLoaded', async () => {
    try {
        message.textContent = 'Completing sign-in...'

        // Give Supabase a moment to restore/exchange the session after redirect
        let session = null
        let authUser = null

        for (let i = 0; i < 10; i++) {
            const { data, error } = await supabase.auth.getSession()

            if (error) {
                throw new Error(error.message)
            }

            session = data.session
            authUser = session?.user || null

            if (authUser) break

            await new Promise(resolve => setTimeout(resolve, 300))
        }

        if (!authUser) {
            message.textContent = 'No active session found after sign-in.'
            return
        }

        const params = new URLSearchParams(window.location.search)
        const requestedRole = params.get('role')

        if (!requestedRole || !['student', 'vendor', 'admin'].includes(requestedRole)) {
            message.textContent = 'Invalid or missing role in callback URL.'
            return
        }

        let userRow = await getUserById(authUser.id)

        if (!userRow) {
            message.textContent = 'Creating user profile...'

            await createUserProfile({
                id: authUser.id,
                email: authUser.email,
                role: requestedRole
            })

            userRow = await getUserById(authUser.id)
        }

        if (!userRow) {
            message.textContent = 'User profile could not be created.'
            return
        }

        if (userRow.role !== requestedRole) {
            message.textContent = `This account is registered as ${userRow.role}, not ${requestedRole}.`
            return
        }

        if (userRow.role === 'student') {
            window.location.href = 'student-dashboard.html'
            return
        }

        if (userRow.role === 'vendor') {
            const vendor = await getVendorProfileByUserId(authUser.id)

            if (!vendor) {
                window.location.href = 'vendor-onboarding.html'
                return
            }

            if (vendor.status === 'pending') {
                message.textContent = 'Your vendor account is waiting for admin approval.'
                return
            }

            if (vendor.status === 'suspended') {
                message.textContent = 'Your vendor account has been suspended.'
                return
            }

            if (vendor.status === 'approved') {
                window.location.href = 'vendor-dashboard.html'
                return
            }

            message.textContent = 'Unknown vendor status.'
            return
        }

        if (userRow.role === 'admin') {
            window.location.href = 'admin-dashboard.html'
            return
        }

        message.textContent = 'Unknown user role.'
    } catch (error) {
        console.error('Auth callback error:', error)
        message.textContent = error.message || 'Authentication failed.'
    }
})