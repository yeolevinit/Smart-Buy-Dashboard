import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, TrendingUp, Calendar, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { mockApiCall } from "@/data/mockData";

// Define the Project interface locally since we removed it from mockData
interface Project {
  id: string;
  name: string;
  type: string;
  size: string;
  state: string;
  city: string;
  volume: number;
  status: 'active' | 'completed' | 'planning';
  isPredicted: boolean;
  createdAt: Date;
  timeline: {
    design: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    development: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    procurement: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    installation: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
  };
}



// Define mock chat messages locally since we removed them from mockData
const mockChatMessages = [
  {
    id: '1',
    message: 'Hello! I can help you with procurement planning and material optimization. What would you like to know?',
    isUser,
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    message: 'What are the most cost-effective alternatives for structural steel in my project?',
    isUser,
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    id: '3',
    message: 'Based on current market trends, I recommend ordering steel materials 2 weeks earlier than planned due to supply chain constraints.',
    isUser,
    timestamp: new Date('2024-01-15T10:01:30'),
  },
];

export function ChatbotPanel({ project }) {
  const [messages, setMessages] = useState(mockChatMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      message,
      isUser,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await mockApiCall('/chatbot', { message, projectId: project.id });
      
      if (response.success) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          message: response.message,
          isUser,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        isUser,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the cost optimization opportunities for this project?",
    "When should I place orders for critical materials?",
    "Are there any supply chain risks I should be aware of?",
    "Can you recommend alternative materials to reduce costs?",
    "What's the optimal procurement timeline for this project?"
  ];

  return (
    <div className="tab-content h-full flex flex-col">
      <Card className="dashboard-card flex-1 flex flex-col">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Procurement Assistant
          </CardTitle>
          <CardDescription>
            Get intelligent insights and recommendations for your procurement strategy
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity, y: 10 }}
                  animate={{ opacity, y: 0 }}
                  exit={{ opacity, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div style={{height:'fit-content'}} className={`p-2 rounded-full ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${message.isUser ? 'text-right' : 'text-left'}`}>
                    <div className={`p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity, y: 10 }}
                  animate={{ opacity, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 3 && (
            <div className="px-6 py-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Suggested questions:</h4>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity, x: -20 }}
                    animate={{ opacity, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    onClick={() => setInputValue(question)}
                    className="text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-border">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about procurement strategy, costs, timelines..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className="gradient-button"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
