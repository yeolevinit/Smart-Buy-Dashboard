import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { Loader2 } from "lucide-react";

// Check if user is authenticated
export const isAuthenticated = () => {
  const user = localStorage.getItem("user");
  return !!user;
};

// Logout function
export const logout = () => {
  localStorage.removeItem("user");
};

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiService.login({ username, password });
      
      if (result.success) {
        // Store user info in localStorage or context
        localStorage.setItem("user", JSON.stringify(result.user));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.username}!`,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await apiService.registerUser({ username, email, password });
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "You can now log in with your credentials",
        });
        setIsLogin(true);
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Login to Smart Buy" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Enter your credentials to access your dashboard" 
              : "Register to get started with Smart Buy Dashboard"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Logging in..." : "Registering..."}
                </>
              ) : isLogin ? (
                "Login"
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </CardContent>
        
        {/* <CardFooter className="flex flex-col">
          <Button
            variant="link"
            className="text-sm"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
