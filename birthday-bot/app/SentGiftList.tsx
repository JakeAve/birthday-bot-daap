import React, { useEffect } from "react";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convertGiftData } from "@/lib/convertBirthdayData";
import { Types } from "aptos";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";

export type Gift = {
  address: string;
  amount: number;
  timestamp: number;
};

/*
  List of gifts that the user has sent to others.
*/
export default function SentGiftList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Wallet adapter state
  const { account, connected, signAndSubmitTransaction } = useWallet();
  // Gift list state
  const [gifts, setGifts] = React.useState<Gift[]>([]);

  /* 
    Retrieves the gifts sent by the user whenever the account, connected, or isTxnInProgress state 
    changes.
  */
  useEffect(() => {
    if (connected) {
      getGifts().then((gifts) => {
        setGifts(gifts);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /* 
    Retrieves the gifts sent by the user.
  */
  const getGifts = async () => {
    try {
      if (!account) {
        throw new Error("No account found");
      }

      const body = {
        function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::view_gifters_gifts`,
        type_arguments: [],
        arguments: [account.address],
      };

      const resp = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/view`,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!resp.ok) {
        throw new Error(`${resp.status}, ${resp.statusText}`);
      }
      const data = await resp.json();
      return convertGiftData(data);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  /*
    Cancels a gift sent by the user.
  */
  const cancelGift = async (recipientAddress: string) => {
    try {
      props.setTxn(true);

      const payload: Types.TransactionPayload = {
        type: " public entry fun",
        function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::remove_birthday_gift`,
        type_arguments: [],
        arguments: [recipientAddress],
      };

      const resp = await signAndSubmitTransaction(payload);

      toast({
        title: "Cancelled",
        description: `Gift cancelled from ${`${recipientAddress.slice(
          0,
          6
        )}...${recipientAddress.slice(-4)}`}`,
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${resp.hash}?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (err) {
      console.error(err);
    }
    props.setTxn(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <CardTitle className="my-2">Gifts sent from you</CardTitle>
        <CardDescription className="break-normal w-96">
          View all of the unclaimed gifts you have sent to others. You can
          cancel any of these gifts at any time and the APT will be returned to
          your wallet.
        </CardDescription>
      </div>
      <ScrollArea className="border rounded-lg">
        <div className="h-fit max-h-56">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Recipient</TableHead>
                <TableHead className="text-center">Birthday</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Cancel gift</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <p className="break-normal w-80 text-center">
                      You don't have any active gifts. Send a gift to someone to
                      get started!
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {gifts.map((gift, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {`${gift.address.slice(
                              0,
                              6
                            )}...${gift.address.slice(-4)}`}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{gift.address}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {new Date(gift.timestamp).toLocaleDateString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(gift.timestamp).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {gift.amount.toFixed(2)} APT
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{gift.amount.toFixed(8)} APT</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel the gift for{" "}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="underline">
                                    {`${gift.address.slice(
                                      0,
                                      6
                                    )}...${gift.address.slice(-4)}`}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{gift.address}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>{" "}
                              and return the{" "}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="underline">
                                    {gift.amount.toFixed(2)} APT
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{gift.amount.toFixed(8)} APT</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>{" "}
                              APT to your wallet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Nevermind</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                cancelGift(gift.address);
                              }}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
