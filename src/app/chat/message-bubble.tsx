import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User } from "lucide-react"

interface MessageBubbleProps {
  content: string
  role: 'user' | 'assistant'
  model?: string
  timestamp?: number
}

export function MessageBubble({ content, role, model, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback>
          {role === 'user' ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <Card className={`max-w-[80%] ${role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {role === 'user' ? 'You' : 'Assistant'}
              </span>
              {model && role === 'assistant' && (
                <Badge variant="secondary" className="text-xs">
                  {model.split('/')[1]}
                </Badge>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none dark:prose-invert">
            {content}
          </div>

          {timestamp && (
            <div className="text-xs text-muted-foreground mt-2">
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
