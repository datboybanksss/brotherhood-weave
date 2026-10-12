import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import ApplicationForm from "./ApplicationForm";
import { submitGuestApplication } from "@/api/guest-applications";
vi.mock("@/api/guest-applications", async (original) => ({ ...await original<typeof import("@/api/guest-applications")>(), submitGuestApplication: vi.fn() }));
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><ApplicationForm onSubmitted={() => {}} /></QueryClientProvider>); }
describe("membership application", () => {
  it("keeps empty answers on the first step", async () => {
    mount(); fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Please enter your city")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Let's start with you." })).toBeInTheDocument();
  });
  it("requires review before submission and preserves answers after a failed save", async () => {
    vi.mocked(submitGuestApplication).mockRejectedValueOnce(new Error("offline"));
    mount(); fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sample Applicant" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "sample@example.com" } });
    fireEvent.change(screen.getByLabelText("Where are you based?"), { target: { value: "Johannesburg" } });
    fireEvent.change(screen.getByLabelText("What do you do or study?"), { target: { value: "Finance student" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "What brings you here?" });
    fireEvent.change(screen.getByLabelText("Why do you want to join Family Ties?"), { target: { value: "I want to build lasting relationships and grow with other members." } });
    fireEvent.change(screen.getByLabelText("What would you bring to the brotherhood?"), { target: { value: "I can share my experience and consistently show up for the community." } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "A final look." });
    expect(submitGuestApplication).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(submitGuestApplication).toHaveBeenCalledWith(expect.objectContaining({ city: "Johannesburg", commitment: true })));
    expect(await screen.findByText(/We couldn't submit/)).toBeInTheDocument();
    expect(screen.getByText("Johannesburg")).toBeInTheDocument();
  });
});
