import { Layout } from "~/root";
import { Outlet } from "react-router"
import { Link } from "react-router"
import "./navbar.css"
import Home from "./icons/home" 
import Logo from "../logo"
import type { ReactElement } from "react";
export default function Header() {
    return (
        <>
            <div className="header">
                <div className="headerElements">
                <Logo className="logo" />
                <HeaderElement label="Home" link="/" children={<Home/>} prefetch="render"></HeaderElement>
                <HeaderElement label="Flüge" link="/flights" prefetch="render" children={<Home/>} />
                </div>
            </div>
            <Outlet/>
        </>
    )
}
function HeaderElement({label, link, prefetch, children}: {label: string, link: string, prefetch: string, children: ReactElement}) {
    return(
        <div style={{display: "flex", flexDirection: "row"}}>
            <Link to={link} style={{color: "inherit", textDecoration: "none", borderBottom: "none"}}>
            <span className="headerElements">{children}</span>
            <span className="headerLabel">{label}</span>
            </Link>
        </div>
    )
}