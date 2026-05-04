import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoreList from "@/components/library/CoreList";
import ArchivesList from "@/components/library/ArchivesList";
import PlaybooksList from "@/components/library/PlaybooksList";

const LAYERS = ["core", "archives", "playbooks"] as const;

export default function Library() {
  const [params, setParams] = useSearchParams();
  const layer = LAYERS.includes(params.get("layer") as any) ? params.get("layer")! : "core";

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Knowledge Library</h1>
      <Tabs value={layer} onValueChange={(v) => setParams({ layer: v })}>
        <TabsList className="w-full">
          <TabsTrigger value="core" className="flex-1">The Core</TabsTrigger>
          <TabsTrigger value="archives" className="flex-1">The Archives</TabsTrigger>
          <TabsTrigger value="playbooks" className="flex-1">The Playbooks</TabsTrigger>
        </TabsList>
        <TabsContent value="core"><CoreList /></TabsContent>
        <TabsContent value="archives"><ArchivesList /></TabsContent>
        <TabsContent value="playbooks"><PlaybooksList /></TabsContent>
      </Tabs>
    </div>
  );
}
