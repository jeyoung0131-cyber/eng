import { FinanceProvider } from '@/components/finance-provider'
import { AppShell } from '@/components/app-shell'

export default function Page() {
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  )
}
