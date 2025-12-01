import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { DollarSign, UserPlus, GitMerge, Layers, Trophy, type LucideIcon } from 'lucide-react';

interface IncomeCard {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface DashboardIncomeCardsProps {
  totalEarnings: number;
  sponsorIncome: number;
  binaryIncome: number;
  topRewardIncome: number;
  matrixIncome: number;
}

export function DashboardIncomeCards({ 
  totalEarnings, 
  sponsorIncome, 
  binaryIncome, 
  topRewardIncome,
  matrixIncome 
}: DashboardIncomeCardsProps) {
  const incomeCards: IncomeCard[] = [
    {
      title: 'Total Income',
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      description: 'All time earnings',
      icon: DollarSign,
      link: '/user/income/total',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Direct Sponsor Income',
      value: `₹${sponsorIncome.toLocaleString('en-IN')}`,
      description: 'From direct referrals',
      icon: UserPlus,
      link: '/user/income/sponsor',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Binary Match Income',
      value: `₹${binaryIncome.toLocaleString('en-IN')}`,
      description: 'From binary tree matching',
      icon: GitMerge,
      link: '/user/income/binary',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'TOP REWARD Income',
      value: `₹${topRewardIncome.toLocaleString('en-IN')}`,
      description: 'Special reward income',
      icon: Trophy,
      link: '/user/income/top-reward',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Matrix Income',
      value: `₹${matrixIncome.toLocaleString('en-IN')}`,
      description: 'From matrix levels 1-5',
      icon: Layers,
      link: '/user/income/matrix',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <Card data-testid="card-income-summary">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Income Summary</CardTitle>
        <CardDescription>
          Click on any card to view detailed income breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {incomeCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.link}>
                <Card 
                  className={`hover-elevate active-elevate-2 cursor-pointer transition-all border-2 ${card.borderColor} ${card.bgColor}`}
                  data-testid={`card-income-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`text-income-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {card.value}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
