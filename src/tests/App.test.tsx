import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";

describe("tests for the App", () => {
  let venueSlugInput: HTMLInputElement;
  let cartValueInput: HTMLInputElement;
  let latitudeInput: HTMLInputElement;
  let longitudeInput: HTMLInputElement;
  let calculateButton: HTMLButtonElement;

  beforeEach(() => {
    render(<App />);
    venueSlugInput = screen.getByPlaceholderText("Venue slug") as HTMLInputElement;
    cartValueInput = screen.getByPlaceholderText("Cart value") as HTMLInputElement;
    latitudeInput = screen.getByPlaceholderText("Latitude") as HTMLInputElement;
    longitudeInput = screen.getByPlaceholderText("Longitude") as HTMLInputElement;
    calculateButton = screen.getByText("Calculate delivery price") as HTMLButtonElement;
  });

  const fillFormInputs = (inputs: {
    venueSlug?: string;
    cartValue?: number;
    latitude?: string;
    longitude?: string;
  }) => {
    if (inputs.venueSlug !== undefined) {
      fireEvent.change(venueSlugInput, { target: { value: inputs.venueSlug } });
    }
    if (inputs.cartValue !== undefined) {
      fireEvent.change(cartValueInput, { target: { value: inputs.cartValue } });
    }
    if (inputs.latitude !== undefined) {
      fireEvent.change(latitudeInput, { target: { value: inputs.latitude } });
    }
    if (inputs.longitude !== undefined) {
      fireEvent.change(longitudeInput, { target: { value: inputs.longitude } });
    }
  };

  it("renders the App component", () => {
    expect(screen.getByText("Delivery Order Price Calculator")).toBeInTheDocument();
  });

  it("allows user to input venue slug", () => {
    fireEvent.change(venueSlugInput, { target: { value: "test-venue" } });
    expect(venueSlugInput).toHaveValue("test-venue");
  });

  it("allows user to input cart value", () => {
    fireEvent.change(cartValueInput, { target: { value: 50.13 } });
    expect(cartValueInput).toHaveValue(50.13);
  });

  it("allows user to input latitude and longitude", () => {
    fireEvent.change(latitudeInput, { target: { value: "60.201" } });
    fireEvent.change(longitudeInput, { target: { value: "24.941" } });
    expect(latitudeInput).toHaveValue("60.201");
    expect(longitudeInput).toHaveValue("24.941");
  });

  it("calculate delivery price is disabled when input is invalid", () => {
    fillFormInputs({
      venueSlug: "test-venue",
      cartValue: 50.13,
      latitude: "60.201",
      longitude: "",
    });
    expect(calculateButton).toBeDisabled();
  });

  it("calculate delivery price is enabled when input is valid", () => {
    fillFormInputs({
      venueSlug: "test-venue",
      cartValue: 50.13,
      latitude: "60.201",
      longitude: "24.941",
    });
    expect(calculateButton).toBeEnabled();
  });

  it("price breakdown is shown when calculate delivery price is clicked with valid input", async () => {
    fillFormInputs({
      venueSlug: "home-assignment-venue-helsinki",
      cartValue: 50.13,
      latitude: "60.16",
      longitude: "24.92",
    });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText("Price breakdown")).toBeInTheDocument();
      expect(screen.getByText("54.03")).toBeInTheDocument();
    });
  });

  it("delivery not possible is shown when distance is too far", async () => {
    fillFormInputs({
      venueSlug: "home-assignment-venue-helsinki",
      cartValue: 50.13,
      latitude: "61.20",
      longitude: "25.90",
    });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText("Delivery not possible")).toBeInTheDocument();
    });
  });
});
