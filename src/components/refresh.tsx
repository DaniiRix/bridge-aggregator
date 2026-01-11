import { ProgressCircle } from "@chakra-ui/react";
import { useId } from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { QUOTES_REFETCH_TIME_MS } from "@/hooks/use-quote";
import { Tooltip } from "./ui/tooltip";

const REFETCH_SECONDS = QUOTES_REFETCH_TIME_MS / 1000;

export const RefreshQuotes = ({
  refetch,
  lastFetched,
}: {
  refetch: () => void;
  lastFetched: number;
}) => {
  const tooltipId = useId();

  const nextRefreshAt = lastFetched + QUOTES_REFETCH_TIME_MS;
  const secondsLeft = useCountdown(nextRefreshAt);

  const progress = 100 - (secondsLeft / REFETCH_SECONDS) * 100;

  return (
    <Tooltip
      ids={{ trigger: tooltipId }}
      content={
        secondsLeft === 0
          ? "Quotes will refresh shortly"
          : `Quotes auto refresh in ${secondsLeft}s. Click to refresh now`
      }
    >
      <ProgressCircle.Root
        ids={{ root: tooltipId }}
        value={progress}
        size="xs"
        onClick={refetch}
        cursor="pointer"
      >
        <ProgressCircle.Circle>
          <ProgressCircle.Track stroke="bg.2" />
          <ProgressCircle.Range stroke="blue.400" />
        </ProgressCircle.Circle>
      </ProgressCircle.Root>
    </Tooltip>
  );
};
