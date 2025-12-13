import { motion } from 'framer-motion';
import { Heart, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CouplesWelcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-couples-gradient text-foreground flex flex-col items-center justify-center px-6 py-16">
      <div className="couples-glow absolute inset-0 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-couples-accent/20 border border-couples-accent/30">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="w-12 h-12 text-couples-accent" fill="currentColor" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          Your journey together starts now 💕
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-foreground/70 mb-8"
        >
          Welcome to Luna Couples. Your space to reconnect, understand, and grow together.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate('/couples')}
            size="lg"
            className="bg-couples-accent hover:bg-couples-accent/90 text-background font-semibold px-8 py-6 text-lg rounded-full shadow-lg w-full flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Invite Your Partner
          </Button>
          
          <Button
            onClick={() => navigate('/couples')}
            variant="outline"
            size="lg"
            className="border-couples-accent/50 text-couples-accent hover:bg-couples-accent/10 font-semibold px-8 py-6 text-lg rounded-full w-full flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Explore Couples Features
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-foreground/50 mt-8"
        >
          Need to create an account first?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-couples-accent underline hover:no-underline"
          >
            Sign up here
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CouplesWelcome;
