import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function PlaceholderChart() {

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Chart TBD</CardTitle>
        <CardDescription className="text-xs">Coming soon</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[200px] gap-3">
        <AlertCircle className="w-8 h-8 text-muted-foreground opacity-50" />
        <p className="text-xs text-muted-foreground text-center">
          Placeholder for future chart
        </p>
      </CardContent>
    </Card>
  );
}
