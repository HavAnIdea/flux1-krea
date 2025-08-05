"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader, CreditCard, Shield, Zap } from "lucide-react";

interface PaymentProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const steps = [
  {
    id: 1,
    title: "Validating Plan",
    description: "Checking subscription details",
    icon: <Zap className="h-4 w-4" />,
    duration: 1000
  },
  {
    id: 2,
    title: "Creating Session",
    description: "Setting up secure payment",
    icon: <Shield className="h-4 w-4" />,
    duration: 1500
  },
  {
    id: 3,
    title: "Redirecting",
    description: "Taking you to payment page",
    icon: <CreditCard className="h-4 w-4" />,
    duration: 1000
  }
];

export default function PaymentProgress({ isVisible, onComplete }: PaymentProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        setProgress(100);
        onComplete?.();
        return;
      }

      setCurrentStep(stepIndex);
      const step = steps[stepIndex];
      const stepProgress = (stepIndex / steps.length) * 100;
      
      // 动画进度条
      let currentProgress = stepProgress;
      const targetProgress = ((stepIndex + 1) / steps.length) * 100;
      const progressIncrement = (targetProgress - stepProgress) / (step.duration / 50);

      intervalId = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(intervalId);
        }
        setProgress(currentProgress);
      }, 50);

      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your checkout session
            </p>
          </div>

          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-primary/10' : isCompleted ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-primary' : 
                        isCompleted ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${
                        isActive ? 'text-primary/70' : 
                        isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This process is secure and encrypted
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}