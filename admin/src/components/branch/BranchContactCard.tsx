"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

interface BranchContactCardProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  googleMapsUrl: string;
  onGoogleMapsUrlChange: (value: string) => void;
}

export function BranchContactCard({
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  googleMapsUrl,
  onGoogleMapsUrlChange,
}: BranchContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Холбоо барих
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Утас</Label>
            <Input
              id="phone"
              placeholder="77710900"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Имэйл</Label>
            <Input
              id="email"
              type="email"
              placeholder="au@corelandmark.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="googleMapsUrl">Google Maps холбоос</Label>
          <Input
            id="googleMapsUrl"
            placeholder="https://maps.google.com/..."
            value={googleMapsUrl}
            onChange={(e) => onGoogleMapsUrlChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Google Maps дээрээс байршлын холбоосыг хуулж оруулна уу
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
