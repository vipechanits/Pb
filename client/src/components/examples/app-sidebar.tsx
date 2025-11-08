import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../app-sidebar';

export default function AppSidebarExample() {
  const style = {
    '--sidebar-width': '20rem',
    '--sidebar-width-icon': '4rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-[600px] w-full">
        <AppSidebar />
        <div className="flex-1 p-4 bg-background">
          <p>Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
