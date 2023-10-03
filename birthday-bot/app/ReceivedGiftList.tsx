import React, { useEffect, useState } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Types } from "aptos";
import { convertRecipientData } from "@/lib/convertBirthdayData";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export type RecipientGifts = {
  from: string;
  amount: number;
  timestamp: number;
};

/* 
  Lists all of the user's received gifts. Allows the user to claim gifts whose release time has 
  passed.
*/
export default function ReceivedGiftList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Lists of gifts sent to the user
  const [gifts, setGifts] = React.useState<RecipientGifts[]>([]);
  // State for the wallet
  const { account, connected, signAndSubmitTransaction } = useWallet();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* 
    Get's the gifts sent to the user when the account, connected, or isTxnInProgress state 
    variables change. 
  */
  useEffect(() => {
    if (connected) {
      getGifts().then((gifts) => {
        setGifts(gifts);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /* 
    Gets the gifts sent to the user.
  */
  const getGifts = async () => {
    try {
      if (!account) {
        throw new Error("No account found");
      }

      const body = {
        function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::view_recipients_gifts`,
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
        throw new Error(`${resp.status}, ${resp.statusText}`)
      }
      const data = await resp.json();
      return convertRecipientData(data);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  /* 
    Claims a gift sent to the user.
  */
  const claimGift = async (giftSender: string) => {
    try {
      props.setTxn(true);
      const payload: Types.TransactionPayload = {
        type: " public entry fun",
        function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::claim_birthday_gift`,
        type_arguments: [],
        arguments: [giftSender],
      };
      const resp = await signAndSubmitTransaction(payload);
      toast({
        title: "Gift claimed!",
        description: `Gift claimed from ${`${giftSender.slice(
          0,
          6
        )}...${giftSender.slice(-4)}`}`,
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
        <CardTitle className="my-2">Gifts sent to you!</CardTitle>
        <CardDescription className="break-normal w-96">
          View and open all of your gifts! You can only open gifts after the
          release time has passed. Spend your gifts on something nice!
        </CardDescription>
      </div>
      <ScrollArea className="border rounded-lg">
        <div className="h-fit max-h-56">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">From</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Release time</TableHead>
                <TableHead className="text-center">Claim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <p className="break-normal w-80 text-center">
                      You have no gifts yet. Send some gifts to your friends for
                      their birthdays!
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {gifts.map((gift, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {`${gift.from.slice(0, 6)}...${gift.from.slice(
                              -4
                            )}`}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{gift.from}</p>
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
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          claimGift(gift.from);
                        }}
                        disabled={currentTime.getTime() < gift.timestamp}
                      >
                        Claim
                      </Button>
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
