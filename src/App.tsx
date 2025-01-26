import { useEffect, useState } from "react";
import { getDistance } from "geolib";

type coordinates = [number, number];

type distanceRanges = {
  min: number;
  max: number;
  a: number;
  b: number;
};

interface apiData {
  coordinates: coordinates;
  orderMinimumNoSurcharge: number;
  basePrice: number;
  distanceRanges: distanceRanges[];
}

function App() {
  const [venueSlug, setVenueSlug] = useState<string>("");
  const [cartValue, setCartValue] = useState<number>(0);
  const [userLatitude, setUserLatitude] = useState<string>("");
  const [userLongitude, setUserLongitude] = useState<string>("");
  const [locationAllowed, setLocationAllowed] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPriceBreakdown, setShowPriceBreakdown] = useState<boolean>(false);
  const [showDeliveryNotPossible, setShowDeliveryNotPossible] =
    useState<boolean>(false);
  const [apiData, setApiData] = useState<apiData>();
  const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
  const [orderCartValue, setOrderCartValue] = useState<string>("");
  const [smallOrderSurcharge, setSmallOrderSurcharge] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [totalPrice, setTotalPrice] = useState<string>("");

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationAllowed(true);
          setUserLatitude(pos.coords.latitude.toString());
          setUserLongitude(pos.coords.longitude.toString());
        },
        () => {
          setLocationAllowed(false);
        }
      );
    }
  };

  const fetchDataFromVenueApi = async () => {
    const staticUrl = `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/static`;
    const dynamicUrl = `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/dynamic`;
    try {
      const responseStatic = await fetch(staticUrl);
      const responseDynamic = await fetch(dynamicUrl);

      if (!responseStatic.ok) {
        const errorData = await responseStatic.json();
        throw new Error(errorData.message || "Failed to fetch static data");
      }

      if (!responseDynamic.ok) {
        const errorData = await responseDynamic.json();
        throw new Error(errorData.message || "Failed to fetch dynamic data");
      }

      const dataStatic = await responseStatic.json();
      const dataDynamic = await responseDynamic.json();
      setApiData({
        coordinates: dataStatic.venue_raw.location.coordinates,
        orderMinimumNoSurcharge:
          dataDynamic.venue_raw.delivery_specs.order_minimum_no_surcharge,
        basePrice:
          dataDynamic.venue_raw.delivery_specs.delivery_pricing.base_price,
        distanceRanges:
          dataDynamic.venue_raw.delivery_specs.delivery_pricing.distance_ranges,
      });
      setErrorMessage("");
    } catch (error: any) {
      setShowDeliveryNotPossible(false);
      setShowPriceBreakdown(false);
      setErrorMessage(error.message);
    }
  };

  const distance = () => {
    const distanceBetween = getDistance(
      { latitude: apiData!.coordinates[1], longitude: apiData!.coordinates[0] },
      { latitude: userLatitude, longitude: userLongitude }
    );
    return distanceBetween;
  };

  const calculatePriceBreakdown = () => {
    const distanceBetween = distance();
    if (apiData!.distanceRanges.slice(-1)[0].min <= distanceBetween) {
      setShowPriceBreakdown(false);
      setShowDeliveryNotPossible(true);
    } else {
      setDeliveryDistance(distanceBetween);
      setOrderCartValue(cartValue.toFixed(2));
      const orderMinumumMinusCart =
        apiData!.orderMinimumNoSurcharge - cartValue * 100;
      setSmallOrderSurcharge(
        orderMinumumMinusCart > 0
          ? (orderMinumumMinusCart / 100).toFixed(2)
          : "0.00"
      );
      const distanceRange = apiData!.distanceRanges.filter(
        (dataPoint) =>
          dataPoint.min <= distanceBetween && dataPoint.max > distanceBetween
      )[0];
      const deliveryfee =
        apiData!.basePrice +
        distanceRange.a +
        (distanceRange.b * distanceBetween) / 10;
      setDeliveryFee((deliveryfee / 100).toFixed(2));
      setTotalPrice(
        (
          cartValue +
          ((orderMinumumMinusCart > 0 ? orderMinumumMinusCart : 0) +
            deliveryfee) /
            100
        ).toFixed(2)
      );
      setShowPriceBreakdown(true);
      setShowDeliveryNotPossible(false);
    }
  };

  const checkLatitude = (value: string) => {
    if (Number(value) || value === "-" || value === "") {
      setUserLatitude(value);
    }
  };

  const checkLongitude = (value: string) => {
    if (Number(value) || value === "-" || value === "") {
      setUserLongitude(value);
    }
  };

  useEffect(() => {
    if (apiData) {
      calculatePriceBreakdown();
    }
  }, [apiData]);

  return (
    <main className="flex flex-col gap-4 items-center p-4">
      <section className="flex flex-col border-2 border-slate-300 py-4 px-4 sm:w-1/3 rounded-xl">
        <h1 className="font-bold mb-4 text-center">
          Delivery Order Price Calculator
        </h1>
        <hr className="text-slate-300 border-1"></hr>
        <h2 className="font-bold mt-4">Details</h2>
        <form
          className="flex flex-col gap-1 my-2"
          aria-label="Delivery Price Form"
        >
          <label htmlFor="venueSlug" className="sr-only">Venue Slug</label>
          <input
            className="border-2 border-slate-300 rounded-lg p-2 mb-2"
            onChange={(e) => setVenueSlug(e.target.value)}
            data-test-id="venueSlug"
            type="text"
            id="venueSlug"
            name="venueSlug"
            placeholder="Venue slug"
          ></input>
          <label htmlFor="cartValue" className="sr-only">Cart Value (€)</label>
          <input
            className="border-2 border-slate-300 rounded-lg p-2 mb-2"
            onChange={(e) => setCartValue(parseFloat(e.target.value))}
            data-test-id="cartValue"
            type="number"
            id="cartValue"
            name="cartValue"
            placeholder="Cart value"
          ></input>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <span>
              <label htmlFor="userLatitude" className="sr-only">Latitude</label>
              <input
                className="border-2 w-full border-slate-300 rounded-lg p-2"
                onChange={(e) => checkLatitude(e.target.value)}
                value={userLatitude}
                data-test-id="userLatitude"
                type="string"
                id="userLatitude"
                name="userLatitude"
                placeholder="Latitude"
              ></input>
            </span>
            <span>
              <label htmlFor="userLongitude" className="sr-only">Longitude</label>
              <input
                className="border-2 w-full border-slate-300 rounded-lg p-2"
                onChange={(e) => checkLongitude(e.target.value)}
                value={userLongitude}
                data-test-id="userLongitude"
                type="string"
                id="userLongitude"
                name="userLongitude"
                placeholder="Longitude"
              ></input>
            </span>
          </div>
        </form>
        <div className="flex">
          <button
            onClick={() => getLocation()}
            aria-label="Use browser's location to auto-fill latitude and longitude"
            className="p-2 whitespace-nowrap border-2 border-slate-300 rounded-lg cursor-pointer w-max mb-4 hover:bg-slate-100"
          >
            Get location
          </button>
          {!locationAllowed && (
            <p className="text-sm ml-2">
              Allow browser to use your location to automatically fill in the
              latitude and longitude fields.
            </p>
          )}
        </div>
        <button
          disabled={
            !(userLatitude && userLongitude && cartValue > 0 && venueSlug)
          }
          aria-disabled={
            !(userLatitude && userLongitude && cartValue > 0 && venueSlug)
          }
          aria-label="Calculate the delivery price"
          onClick={() => fetchDataFromVenueApi()}
          className={`p-4 rounded-xl font-bold ${
            !(userLatitude && userLongitude && cartValue > 0 && venueSlug)
              ? "bg-gray-300"
              : "cursor-pointer bg-blue-400 hover:bg-blue-500 text-white"
          }`}
        >
          Calculate delivery price
        </button>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
      </section>
      {showPriceBreakdown && (
        <div className="flex flex-col border-2 border-slate-300 p-4 sm:w-1/3 rounded-xl">
          <h1 className="font-bold mb-4 text-center">Price breakdown</h1>
          <hr className="text-slate-300 border-1"></hr>
          <div className="mt-4 flex justify-between">
            <div className="font-bold">
              <p>Cart value</p>
              <p>Delivery fee</p>
              <p>Delivery distance</p>
              <p>Small delivery surcharge</p>
              <p>Total price</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-right ">
                <p data-raw-value={cartValue * 100}>{orderCartValue}</p>
                <p data-raw-value={parseFloat(deliveryFee) * 100}>
                  {deliveryFee}
                </p>
                <p data-raw-value={deliveryDistance}>{deliveryDistance}</p>
                <p data-raw-value={parseFloat(smallOrderSurcharge) * 100}>
                  {smallOrderSurcharge}
                </p>
                <p data-raw-value={parseFloat(totalPrice) * 100}>
                  {totalPrice}
                </p>
              </span>
              <span>
                <p>€</p>
                <p>€</p>
                <p>m</p>
                <p>€</p>
                <p>€</p>
              </span>
            </div>
          </div>
        </div>
      )}
      {showDeliveryNotPossible && (
        <div className="flex flex-col border-2 border-red-500 p-4 sm:w-1/3 rounded-xl">
          <h1 className="font-bold text-center">Delivery not possible</h1>
          <p className="mt-2 text-center">
            Unfortunately, the delivery distance is too long for this order.
          </p>
        </div>
      )}
    </main>
  );
}

export default App;
