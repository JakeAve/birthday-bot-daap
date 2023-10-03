import { RecipientGifts } from "@/app/ReceivedGiftList";
import { Gift } from "@/app/SentGiftList";

type BirthdayData = [string[], string[], string[]];

export function convertRecipientData(data: BirthdayData) {
  const entries: RecipientGifts[] = [];
  for (let i = 0; i < data[0].length; i++) {
    const from = data[0][i];
    const amount = parseFloat(data[1][i]) / 100000000;
    const timestamp = Number(data[2][i]) * 1000;
    entries.push({
      from,
      amount,
      timestamp,
    });
  }
  return entries;
}

export function convertGiftData(data: BirthdayData) {
  const entries: Gift[] = [];
  for (let i = 0; i < data[0].length; i++) {
    const address = data[0][i];
    const amount = parseFloat(data[1][i]) / 100000000;
    const timestamp = Number(data[2][i]) * 1000;
    entries.push({
      address,
      amount,
      timestamp,
    });
  }
  return entries;
}
