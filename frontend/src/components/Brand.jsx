import logo from '../assets/tapmart-logo.svg'
import './Brand.css'

const Brand = () => {
  return (
    <a className="brand" href="/" aria-label="TapMart home">
      <img src={logo} alt="TapMart logo" />
      <span>TapMart</span>
    </a>
  )
}

export default Brand
