import { Button, Flex, Input, InputGroup, Text } from "@chakra-ui/react";
import { Check, PencilIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { type Hex, isAddress } from "viem";
import { useConnection } from "wagmi";
import { useBridge } from "@/store/bridge";
import { truncateAddress } from "@/utils/string";
import { toaster } from "./ui/toaster";

export const RecipientEditor = () => {
  const { address } = useConnection();
  const { recipient, setRecipient } = useBridge();

  const [receiver, setReceiver] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveRecipient = useCallback(() => {
    if (!receiver || receiver.trim().length === 0) {
      setIsEditing(false);
      return;
    }

    if (!isAddress(receiver)) {
      toaster.create({
        title: "Invalid address",
        type: "error",
      });
      return;
    }

    setRecipient(receiver as Hex);
    setIsEditing(false);
  }, [receiver, setRecipient]);

  if (!address)
    return (
      <Flex>
        <Text fontSize="sm" color="gray.400">
          To
        </Text>
      </Flex>
    );

  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color="gray.400">
        To
      </Text>

      {isEditing ? (
        <InputGroup
          w={60}
          endElement={
            <Button
              variant="ghost"
              size="2xs"
              p={0}
              onClick={handleSaveRecipient}
            >
              <Check size={12} />
            </Button>
          }
        >
          <Input
            size="2xs"
            placeholder="Enter address"
            rounded="full"
            pattern="^[a-zA-Z0-9]*$"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            autoFocus
          />
        </InputGroup>
      ) : (
        <Button
          size="2xs"
          variant="outline"
          rounded="full"
          onClick={() => setIsEditing(true)}
        >
          {truncateAddress(recipient ?? address)}
          <PencilIcon color="#a1a1aa" />
        </Button>
      )}
    </Flex>
  );
};
