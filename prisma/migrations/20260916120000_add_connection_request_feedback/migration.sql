-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "connectionRequestId" TEXT;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_connectionRequestId_fkey" FOREIGN KEY ("connectionRequestId") REFERENCES "ConnectionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
