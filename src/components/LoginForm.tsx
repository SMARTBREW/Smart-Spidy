import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, User } from 'lucide-react';
import authService from '../services/auth';

const motion = {
  div: ({ children, initial, animate, transition, whileHover, whileTap, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  button: ({ children, whileHover, whileTap, className, ...props }: any) => (
    <button className={className} {...props}>{children}</button>
  ),
  input: ({ className, ...props }: any) => (
    <input className={className} {...props} />
  ),
  select: ({ className, ...props }: any) => (
    <select className={className} {...props} />
  )
};

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Static credentials for testing
  const staticCredentials = {
    user: { email: 'user@example.com', password: 'user123' },
    admin: { email: 'admin@example.com', password: 'admin123' }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await authService.login(email.trim(), password.trim());
        onLogin(response.user);
      } catch (error: any) {
        setError(error.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="flex min-h-[600px]">
            <div className="flex-1 relative overflow-hidden bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <img 
                  src="https://i.pinimg.com/736x/42/b1/a9/42b1a984eb088e65428a7ec727578ece.jpg" 
                  alt="Smart Spidy Logo" 
                  className="w-32 h-32 mx-auto mb-6 rounded-2xl shadow-lg"
                />
                <h2 className="text-3xl font-bold mb-2 text-black">𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘</h2>
                <p className="text-lg text-gray-600">Professional AI Assistant</p>
              </div>
            </div>

            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-white">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-sm mx-auto"
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-black mb-2">Welcome to 𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘</h1>
                  <p className="text-gray-600">Sign in to start your professional conversations</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label htmlFor="email" className="block text-black text-sm font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <motion.input
                        whileHover={{ scale: 1.01 }}
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 focus:ring-gray-500 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label htmlFor="password" className="block text-black text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <motion.input
                        whileHover={{ scale: 1.01 }}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 bg-gray-50 focus:ring-gray-500 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                  </div>



                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginForm;