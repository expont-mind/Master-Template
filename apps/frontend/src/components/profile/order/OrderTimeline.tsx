"use client";

import { MoreVertical } from "@/components/svg";

import { type OrderStep, type StepState } from "./_orderSteps";

interface OrderTimelineProps {
  steps: OrderStep[];
  nextStepIndex: number;
}

function stepIcon(state: StepState, isDelivered: boolean) {
  if (state === "completed") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.33398 9.33203L5.66732 11.6654L12.6673 4.33203"
          stroke={isDelivered ? "#0d9488" : "#64748B"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (state === "next") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 4V8L10 10" stroke="#020617" strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx="8"
          cy="8"
          r="6.5"
          stroke="#020617"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return <div className="w-4 h-4 rounded-full border-[1.5px] border-text-muted" />;
}

function labelClassFor(state: StepState, isDelivered: boolean): string {
  if (state === "completed") {
    return isDelivered
      ? "text-teal-600 text-sm font-normal"
      : "text-text-secondary text-sm font-normal";
  }
  if (state === "next") return "text-text-primary text-sm font-medium";
  return "text-text-muted text-sm font-normal";
}

function timestampClassFor(state: StepState, isDelivered: boolean): string {
  if (state === "completed") {
    return isDelivered
      ? "text-teal-600 text-sm font-normal"
      : "text-text-secondary text-sm font-normal";
  }
  if (state === "next") return "text-text-primary text-sm font-normal";
  return "text-text-muted text-sm font-normal";
}

interface OrderTimelineRowProps {
  step: OrderStep;
  index: number;
  total: number;
  nextStepIndex: number;
}

const OrderTimelineRow = ({ step, index, total, nextStepIndex }: OrderTimelineRowProps) => {
  const state: StepState = step.completed
    ? "completed"
    : index === nextStepIndex
      ? "next"
      : "future";

  // Split timestamp "yyyy/MM/dd  HH:mm:ss" into date and time
  const tsParts = (step.timestamp ?? "").split(/\s{2,}/);
  const date = tsParts[0] || "–";
  const time = tsParts.length > 1 ? tsParts[1] : "–";

  const labelClass = labelClassFor(state, step.isDelivered);
  const tsClass = timestampClassFor(state, step.isDelivered);
  const dashClass = "text-text-muted text-sm font-normal";

  return (
    <div className="flex flex-col gap-1.5 sm:gap-0">
      <div className="flex items-center">
        <div className="w-4 h-4 flex items-center justify-center shrink-0 mr-1.5">
          {stepIcon(state, step.isDelivered)}
        </div>
        <div className="flex-1 flex items-center justify-between min-h-[24px]">
          <p className={`font-manrope leading-5 ${labelClass}`}>{step.label}</p>
          <div className="flex items-center gap-2">
            <p className={`font-manrope leading-5 ${date === "–" ? dashClass : tsClass}`}>{date}</p>
            <p className={`font-manrope leading-5 ${time === "–" ? dashClass : tsClass}`}>{time}</p>
          </div>
        </div>
      </div>
      {index < total - 1 && (
        <div className="w-4 flex justify-center">
          <MoreVertical />
        </div>
      )}
    </div>
  );
};

export const OrderTimeline = ({ steps, nextStepIndex }: OrderTimelineProps) => {
  return (
    <>
      {steps.map((step, index) => (
        <OrderTimelineRow
          key={step.label}
          step={step}
          index={index}
          total={steps.length}
          nextStepIndex={nextStepIndex}
        />
      ))}
    </>
  );
};
