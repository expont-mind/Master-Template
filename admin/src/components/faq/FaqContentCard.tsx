"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";

interface FaqContentCardProps {
  question: string;
  setQuestion: (value: string) => void;
  answer: string;
  setAnswer: (value: string) => void;
}

export function FaqContentCard({
  question,
  setQuestion,
  answer,
  setAnswer,
}: FaqContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Асуулт & Хариулт
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Асуулт *</Label>
          <Input
            id="question"
            placeholder="Жишээ: Хүргэлтийн хугацаа хэд вэ?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Хариулт *</Label>
          <Textarea
            id="answer"
            placeholder="Хариултыг энд бичнэ үү..."
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
