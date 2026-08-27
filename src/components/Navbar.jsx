import React, { useState } from 'react';
import { Link, useMatch, useResolvedPath } from "react-router-dom"
import { games } from "../data/games";
import '../styles/Navbar.scss';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const closeMenu = () => setMenuOpen(false)
    const homeActive = useMatch({ path: "/", end: true })

    return (
        <>
            <nav>
                <Link
                    to="/"
                    className={homeActive ? "site-title active" : "site-title"}
                    onClick={closeMenu}
                >
                    Games
                </Link>
                <button
                    type="button"
                    className={menuOpen ? "menu open" : "menu"}
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <ul className={menuOpen ? "open" : ""}>
                    {games.map((game) => (
                        <CustomLink key={game.id} to={game.path} onClick={closeMenu}>
                            <img src={game.icon} alt="" />
                            <span>{game.name}</span>
                        </CustomLink>
                    ))}
                </ul>
            </nav>
        </>
    )
}

function CustomLink({to, children, ...props}) {
    const resolvedPath = useResolvedPath(to);
    const isActive = useMatch({ path: resolvedPath.pathname, end: true });
    return (
        <li className={isActive ? "active" : ""}>
            <Link to={to} {...props}>{children}</Link>
        </li>
    )
}

export default Navbar;
