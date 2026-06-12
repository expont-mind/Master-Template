import SecurityCard from "@/components/settings/SecurityCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Тохиргоо</h2>
        <p className="text-muted-foreground">Системийн ерөнхий тохиргоонууд</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ерөнхий тохиргоо</CardTitle>
            <CardDescription>Апп-ын үндсэн тохиргоонуудыг удирдах</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="siteName">Сайтын нэр</Label>
              <Input id="siteName" defaultValue="Монпанг" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="siteDescription">Тайлбар</Label>
              <Input id="siteDescription" defaultValue="Монголын шилдэг онлайн дэлгүүр" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Холбоо барих имэйл</Label>
              <Input id="contactEmail" type="email" defaultValue="info@monpang.mn" />
            </div>
            <Button>Хадгалах</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мэдэгдлийн тохиргоо</CardTitle>
            <CardDescription>Push notification болон имэйл тохиргоо</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Захиалгын мэдэгдэл</p>
                <p className="text-sm text-muted-foreground">
                  Шинэ захиалга орсон үед мэдэгдэл илгээх
                </p>
              </div>
              <Button variant="outline" size="sm">
                Идэвхжүүлсэн
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Төлбөрийн мэдэгдэл</p>
                <p className="text-sm text-muted-foreground">
                  Төлбөр амжилттай болсон үед мэдэгдэл илгээх
                </p>
              </div>
              <Button variant="outline" size="sm">
                Идэвхжүүлсэн
              </Button>
            </div>
          </CardContent>
        </Card>

        <SecurityCard />
      </div>
    </div>
  );
}
