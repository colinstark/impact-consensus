import { useNavigate, useSearchParams } from 'react-router-dom'
import { AccountForm } from '../components/AccountForm'
import { TopBar } from '../components/TopBar'

export default function SignIn() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  return (
    <>
      <TopBar back />
      <main className="mx-auto max-w-md px-5 pt-8 pb-16 safe-bottom">
        <AccountForm onDone={() => nav(next, { replace: true })} />
      </main>
    </>
  )
}
