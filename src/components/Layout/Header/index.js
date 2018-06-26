import { element } from '../../../prometey'
import Button from '../../Button'
import './index.css'

export default class Header {
  state = {
    buttonClicked: false,
  }

  onClick = () => {
    // console.log('from header')
    this.state.buttonClicked = !this.state.buttonClicked
    if (this.state.buttonClicked) {
      this.state.commonMessage = 'it works!!!'
    } else {
      this.state.commonMessage = null
    }
  }

  render() {
    const { buttonClicked, commonMessage } = this.state

    return element('div.header', [
      element('div.logo', [
        element('span.logo', [
          element('h1', 'P'),
          element('div.title', 'rometey'),
        ]),
        commonMessage && element('span.sub-message', ` - ${commonMessage}`),
      ]),
      element('div.actions', [
        buttonClicked && element('label.some-text', 'dynamic childs'),
        element(Button, {
          label: buttonClicked ? 'Clicked!!!' : 'Click me!',
          onClick: this.onClick,
          useClick: true,
        }),
      ]),
    ])
  }
}
