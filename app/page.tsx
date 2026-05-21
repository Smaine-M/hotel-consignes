'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [tasks, setTasks] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  const [roomNumber, setRoomNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('Réception')
  const [priority, setPriority] = useState('normale')

  useEffect(() => {
    checkUser()
  }, [])

  function formatParisDate(date: string | null) {
    if (!date) return ''

    return new Date(date).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
    })
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) {
      console.log('PROFILE CHARGÉ :', data)
setProfile(data)
    }
  }

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    setUser(data.user)

    if (data.user) {
      await loadProfile(data.user.id)
      fetchTasks()
      fetchCompletedTasks()
      fetchRooms()
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    setUser(data.user)

    if (data.user) {
      await loadProfile(data.user.id)
    }

    fetchTasks()
    fetchCompletedTasks()
    fetchRooms()
  }

  async function signUp() {
    if (!firstName || !lastName || !email || !password) {
      alert('Prénom, nom, email et mot de passe obligatoires')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      })

      alert('Compte créé avec succès')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'effectuee')
      .order('created_at', { ascending: false })

    if (error) alert(error.message)
    else setTasks(data || [])
  }

  async function fetchCompletedTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'effectuee')
      .order('completed_at', { ascending: false })

    if (error) alert(error.message)
    else setCompletedTasks(data || [])
  }

  async function fetchRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number')

    if (error) alert(error.message)
    else setRooms(data || [])
  }

  async function createTask() {
    if (!roomNumber || !title) {
      alert('Lieu et type de consigne obligatoires')
      return
    }

    const { error } = await supabase.from('tasks').insert({
  room_number: roomNumber,
  title,
  description,
  department,
  priority,
  status: 'nouvelle',
  created_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
})

    if (error) {
      alert(error.message)
      return
    }

    setRoomNumber('')
    setTitle('')
    setDescription('')
    setDepartment('Réception')
    setPriority('normale')

    fetchTasks()
  }

  async function completeTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .update({
  status: 'effectuee',
  completed_at: new Date().toISOString(),
  completed_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
})
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchTasks()
    fetchCompletedTasks()
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <section className="border rounded-xl p-8 shadow max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6">Connexion</h1>

          <div className="grid gap-4">
            <input
              className="border p-3 rounded"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="border p-3 rounded"
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={login}
              className="bg-black text-white px-4 py-3 rounded-lg"
            >
              Se connecter
            </button>

            <button
              onClick={signUp}
              className="border px-4 py-3 rounded-lg"
            >
              Créer un compte
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Consignes Hôtel</h1>

        <div className="flex items-center gap-4">
  <span className="font-medium">
    {profile?.first_name} {profile?.last_name}
    {profile?.role && ` — ${profile.role}`}
  </span>

  <button
    onClick={logout}
    className="border px-4 py-2 rounded-lg"
  >
    Déconnexion
  </button>
</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="border rounded-xl p-6 shadow h-fit">
          <h2 className="text-xl font-bold mb-4">Créer une consigne</h2>

          <div className="grid gap-4">
            <select
              className="border p-3 rounded"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            >
              <option value="">Sélectionner un lieu</option>

              {rooms.map((room) => (
                <option key={room.id} value={room.room_number}>
                  {room.room_number}
                </option>
              ))}
            </select>

            <select
              className="border p-3 rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              <option value="">Sélectionner un type de consigne</option>
              <option value="Consignes Réception">Consignes Réception</option>
              <option value="Demande client">Demande client</option>
              <option value="ACHAT">ACHAT</option>
              <option value="Administratif">Administratif</option>
              <option value="Technique">Technique</option>
              <option value="Collègues">Collègues</option>
            </select>

            <textarea
              className="border p-3 rounded"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              className="border p-3 rounded"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option>Réception</option>
              <option>Gouvernante</option>
              <option>Maintenance</option>
              <option>Direction</option>
            </select>

            <select
              className="border p-3 rounded"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>

            <button
              onClick={createTask}
              className="bg-black text-white px-4 py-3 rounded-lg"
            >
              Créer la consigne
            </button>
          </div>
        </section>

        <section className="border rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Tâches en cours</h2>

          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold">
                  Chambre {task.room_number}
                </h3>

                <p className="font-medium">{task.title}</p>

                {task.description && (
                  <p className="text-gray-600">{task.description}</p>
                )}

                <p className="text-sm text-gray-500">
                  Service : {task.department}
                </p>

                <p className="text-sm text-gray-500">
                  Priorité : {task.priority}
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  Créée par {task.created_by_name || 'Utilisateur'} le {formatParisDate(task.created_at)}
                </p>

                <button
                  onClick={() => completeTask(task.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg mt-3"
                >
                  Effectuée
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="border rounded-xl p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Tâches effectuées</h2>

          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-xl p-4 shadow-sm bg-gray-50"
              >
                <h3 className="text-lg font-semibold">
                  Chambre {task.room_number}
                </h3>

                <p className="font-medium">{task.title}</p>

                {task.description && (
                  <p className="text-gray-600">{task.description}</p>
                )}

                <p className="text-sm text-gray-500">
                  Service : {task.department}
                </p>

                <p className="text-sm text-gray-500">
                  Priorité : {task.priority}
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  Créée par {task.created_by_name || 'Utilisateur'} le {formatParisDate(task.created_at)}
                </p>

                <p className="text-sm text-green-700">
                  Effectuée par {task.completed_by_name || 'Utilisateur'} le {formatParisDate(task.completed_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}