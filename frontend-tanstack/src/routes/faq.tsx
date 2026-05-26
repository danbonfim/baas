import { createFileRoute } from '@tanstack/react-router'
import { Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/faq')({
  component: () => <Navigate to="/ajuda" />,
})
