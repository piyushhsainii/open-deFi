import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";

const AlertFaucet = () => {
  const [FaucetOpen, setFaucetOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFaucetOpen(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <AlertDialog open={FaucetOpen} onOpenChange={setFaucetOpen}>
        <AlertDialogTrigger asChild>
          <></>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Test Environment Notice</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This lending application is currently deployed on{" "}
                <span className="font-semibold">Solana Devnet</span>.
              </p>
              <p>
                It uses <span className="font-semibold">custom tokens</span>
                for demonstration purposes. To fully explore and test the app,
                you will need tokens from our faucet.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() =>
                window.open("https://your-faucet-link.com", "_blank")
              }
            >
              Get Tokens from Faucet
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlertFaucet;
