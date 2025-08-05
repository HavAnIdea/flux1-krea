"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  History, 
  Settings, 
  Download,
  ExternalLink,
  Loader
} from "lucide-react";
import SubscriptionStatus from "./SubscriptionStatus";
import { useEffect, useState } from "react";
import { subscriptionService } from "@/services/subscription";
import { UserSubscriptionWithPlan } from "@/types/subscription";
import { useAppContext } from "@/contexts/app";
// Simple date formatting function
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function SubscriptionManagement() {
  const { user } = useAppContext();
  const { summary, isLoading } = useSubscription();
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscriptionWithPlan[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        const history = await subscriptionService.getUserSubscriptionHistory(user.id);
        setSubscriptionHistory(history);
      } catch (error) {
        console.error("Error fetching subscription history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, view billing history, and update your plan.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Billing History</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SubscriptionStatus />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = "/#pricing"}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open("mailto:support@flux1-krea.dev", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View all your past subscriptions and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center p-8">
                  <Loader className="h-6 w-6 animate-spin" />
                </div>
              ) : subscriptionHistory.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No billing history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptionHistory.map((subscription) => (
                    <div 
                      key={subscription.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium capitalize">
                            {subscription.plan.name} Plan
                          </h4>
                          <Badge className={getStatusColor(subscription.payment_status)}>
                            {subscription.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Payment Method: {subscription.payment_method || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${subscription.amount_paid.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.plan.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Manage your subscription preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  We'll send you important updates about your subscription to your registered email address.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Billing Information</h4>
                <p className="text-sm text-muted-foreground">
                  Your billing is managed through our secure payment processor. 
                  For billing inquiries, please contact support.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline"
                  onClick={() => window.open("mailto:support@flux1-krea.dev", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}