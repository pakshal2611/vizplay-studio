import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBoxProps {
  insights: any[];
  data: any[];
  columns: any[];
}

export function ChatBox({ insights, data, columns }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I've analyzed your dataset with ${data.length} records across ${columns.length} columns. I found ${insights.length} key insights. How can I help you explore your data further?`,
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Analyze user intent and provide relevant responses
    if (lowerMessage.includes('correlation') || lowerMessage.includes('relationship')) {
      const correlationInsights = insights.filter(i => i.type === 'correlation');
      if (correlationInsights.length > 0) {
        return `I found ${correlationInsights.length} correlation(s) in your data: ${correlationInsights[0].description}. This suggests these variables may be related and could be useful for predictive analysis.`;
      }
      return "I haven't detected any strong correlations in your current dataset. Try adding more numeric columns to analyze relationships.";
    }
    
    if (lowerMessage.includes('outlier') || lowerMessage.includes('anomal')) {
      const outlierInsights = insights.filter(i => i.type === 'outlier');
      if (outlierInsights.length > 0) {
        return `I detected ${outlierInsights.length} outlier pattern(s): ${outlierInsights[0].description}. These unusual values might indicate data quality issues or interesting edge cases worth investigating.`;
      }
      return "No significant outliers detected in your dataset. This suggests your data has consistent patterns.";
    }
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      return `Based on your data structure, I recommend creating time-series charts if you have date columns, or correlation matrices for numeric variables. The most interesting patterns often emerge when comparing ${columns.filter(c => c.type === 'numeric').slice(0, 2).map(c => c.name).join(' and ')}.`;
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('chart')) {
      const numericCols = columns.filter(c => c.type === 'numeric');
      const categoricalCols = columns.filter(c => c.type === 'categorical');
      
      if (numericCols.length >= 2) {
        return `I recommend creating a scatter plot with ${numericCols[0].name} vs ${numericCols[1].name} to explore correlations. Also consider a bar chart grouped by ${categoricalCols[0]?.name || 'categories'} to see distribution patterns.`;
      }
      return "For your dataset, I suggest starting with bar charts to compare categories and KPI tiles to highlight key metrics.";
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      const numericCount = columns.filter(c => c.type === 'numeric').length;
      const categoricalCount = columns.filter(c => c.type === 'categorical').length;
      return `Dataset Summary: ${data.length} records, ${numericCount} numeric columns, ${categoricalCount} categorical columns. Key insights: ${insights.slice(0, 2).map(i => i.title).join(', ')}. The data appears ${data.length > 1000 ? 'substantial' : 'manageable'} for analysis.`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      return "I can help you: 1) Analyze correlations and patterns, 2) Identify outliers and anomalies, 3) Recommend chart types, 4) Explain insights, 5) Suggest data transformations. Try asking about 'correlations', 'outliers', 'chart recommendations', or 'data summary'.";
    }
    
    // Default responses for exploration
    const responses = [
      `Interesting question! Looking at your ${columns.length} columns, you might want to explore the relationship between ${columns[0]?.name} and ${columns[1]?.name}.`,
      `Based on your dataset structure, I notice you have ${columns.filter(c => c.type === 'numeric').length} numeric variables. These could reveal interesting patterns when visualized together.`,
      `Your data has ${data.length} records. Have you considered filtering by specific criteria to drill down into subsets of your data?`,
      `I can help you understand data patterns better. Try asking about specific columns, correlations, or chart recommendations.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Data Assistant
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 pt-0">
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : 'bg-muted mr-8'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'bot' && <Bot className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                    {message.sender === 'user' && <User className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                    <div>{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="bg-muted rounded-lg p-3 mr-8 flex items-center gap-2">
                  <Bot className="h-3 w-3" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-3 pt-3 border-t">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data, correlations, chart suggestions..."
            className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            rows={2}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}