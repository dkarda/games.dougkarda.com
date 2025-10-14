import React, { useState } from 'react';
import { Link, useMatch, useResolvedPath } from "react-router-dom"
import '../styles/Navbar.scss';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false)

    return ( 
        <>
            <nav>
                <Link to="/" className="site-title">Home</Link>
                <div className="menu" onClick={() => {
                    setMenuOpen(!menuOpen)
                }}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <ul className={menuOpen ? "open" : ""}>
                    {/* <CustomLink to="/poker">
                        <img src="https://assets.dougkarda.com/images/icons/poker.jpg" 
                            alt="Poker icon" />
                        <span>Poker</span>
                    </CustomLink> */}
                    <CustomLink to="/concentration">
                        <img src="https://assets.dougkarda.com/images/icons/icon-concentration-trans.png"
                            alt="Concentration game icon" />
                        <span>Concentration</span>
                    </CustomLink>
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