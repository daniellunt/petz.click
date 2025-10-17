
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import useCurrency from '@/lib/useCurrency';

const StatCard = ({ title, value, icon: Icon, description, variants }) => {
  const { symbol } = useCurrency();

  const formatValue = (val) => {
    if (title === "Today's Revenue" && typeof val === 'string' && val.startsWith('$')) {
      return `${symbol}${val.substring(1)}`;
    }
    return val;
  };

  return (
    <motion.div variants={variants}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
