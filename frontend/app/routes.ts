import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/navbar.tsx", [
        index("routes/index.tsx"),
        route("flights", "routes/flights/index.tsx"),
        route("flight/:flightId", "routes/flight/index.tsx")
    ])
] satisfies RouteConfig;
