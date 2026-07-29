import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function PageTransition({ children }: PageTransitionProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) return <>{children}</>;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
