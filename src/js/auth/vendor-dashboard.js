import { supabase } from '../supabaseClient.js'

const logoutBtn = document.getElementById('logout-btn')
const message = document.getElementById('message')

logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
        message.textContent = error.message
        return
    }

    window.location.href = 'vendor-login.html'
})