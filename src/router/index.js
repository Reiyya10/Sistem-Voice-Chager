import { createRouter, createWebHashHistory } from 'vue-router'
import { store, toast } from '../store'
import HomeView from '../views/HomeView.vue'
import VoiceChangerView from '../views/VoiceChangerView.vue'
import KarakterView from '../views/KarakterView.vue'
import RekamanView from '../views/RekamanView.vue'
import TentangView from '../views/TentangView.vue'
import MasukView from '../views/MasukView.vue'
import LanggananView from '../views/LanggananView.vue'
import AkunView from '../views/AkunView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: HomeView },
    { path: '/voice-changer', component: VoiceChangerView },
    { path: '/karakter', component: KarakterView },
    { path: '/rekaman', component: RekamanView },
    { path: '/tentang', component: TentangView },
    { path: '/masuk', component: MasukView },
    { path: '/langganan', component: LanggananView },
    { path: '/akun', component: AkunView, meta: { auth: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.auth && !store.loggedIn) {
    toast('Masuk dulu untuk membuka halaman ini.')
    return '/masuk'
  }
})
export default router
