import { Button } from "@/components/ui/button";
import Layout from "@/layouts/layout";

function App() {
  return (
    <div className="flex min-h-dvh w-full">
      <Layout>
        <Button className="bg-primary text-primary-foreground">Click me</Button>
      </Layout>
    </div>
  );
}

export default App;
