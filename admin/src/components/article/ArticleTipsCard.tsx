"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ArticleTipsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Зөвлөмж</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>• Гарчиг товч, тодорхой байх</p>
        <p>• SEO-д зориулж slug үүсгэх</p>
        <p>• Зураг оруулахдаа &lt;img&gt; tag ашиглах</p>
        <p>• Гарчиг дэд гарчигт &lt;h2&gt;, &lt;h3&gt; ашиглах</p>
      </CardContent>
    </Card>
  );
}
