/**
 *  **** keywords ****
 *  pEl = Prometey element . structure is = { query: (string|class) , props: (any|array|string|object)}
 *  dEl = DOM element . structure is = { query: (same with pEl), element: DOM Element }
 *
 */

import _ from 'lodash'
import { classes } from './classes'
import { Prometey } from './Prometey'
import {
  removePropFromElement,
  addPropsToElement,
  getOnlyNewProps,
} from './props'
import { createDel, attachToDOM } from './DOM'

/**
 * Parse query selector to id, parent, tag, classNames information
 * It needed for create pEl and dEl elements
 *
 *
 * @param {string} queryString
 * @param {(Array<string> | string)} classNames
 * @returns {Object}
 */
const parseQuery = (queryString, classNames) => {
  let [parent, query] = queryString.split('->')
  if (!query) {
    query = parent
    parent = null
  }
  const [element, ...className] = query.split('.')
  const [tag, id] = element.split('#')
  return {
    class: classes(className, classNames),
    id,
    parent,
    tag,
  }
}

const createPel = (data, index, component, parentUid) => {
  const { query, props } = data
  data = { ...parseQuery(query, _.get(props, 'class')) }
  data.query = query
  data.index = index
  if (_.isArray(props)) {
    data.childs = _.compact([...props])
    data.props = undefined
  } else if (_.isObject(props)) {
    if (_.isEmpty(props)) {
      data.props = undefined
    }
    const childs = props.childs
    if (childs && childs.length) {
      data.childs = _.compact([...childs])
    }
    data.props = _.omit(props, ['childs', 'class'])
  } else {
    data.props = props
  }
  data.uid = generateUid(data, index, parentUid)
  if (data.childs) {
    data.childs = createTree(data.childs, data.uid, data)
  }
  if (component) {
    data.component = {
      state: _.clone(component.state),
      render: component.render,
      props: _.clone(component.props),
    }
  }
  return data
}

const removeRemovedChilds = (curDel, curChilds, newChilds) => {
  const dElIndexes = []

  _.forEach(
    _.filter(
      curChilds,
      child => !_.find(newChilds, ch => compareChilds(child, ch))
    ),
    child => {
      curDel.element.removeChild(child.element)
      dElIndexes.push(child.index)
      child.element = null
    }
  )
  _.forEach(dElIndexes, index => {
    curDel.childs.splice(index, 1)
  })
}

const compareChilds = (child, other) => other.uid === child.uid

const addNewChilds = (curDel, curChilds, newChilds) => {
  _.forEach(
    _.filter(
      newChilds,
      child => !_.find(curChilds, ch => compareChilds(child, ch))
    ),
    (child, index) => {
      child.element = createDel(child)
      if (child.childs && child.childs.length) {
        attachToDOM(child.childs)
        _.forEach(child.childs, subChild => {
          console.log('subChild.element.innerHTML', subChild.element.innerHTML)
          child.element.appendChild(subChild.element)
        })
      }
      curDel.element.insertChildAtIndex(child.element, child.index)
      curDel.childs.insert(child.index, child)
    }
  )
}

const compareDels = (curDel, newDel, component, parentDel) => {
  if (curDel.query !== newDel.query) {
    console.log(
      'newDel.tag',
      newDel.tag,
      newDel.class,
      newDel.tag !== curDel.tag
    )
    if (newDel.tag !== curDel.tag) {
      parentDel.element.removeChild(curDel.element)
      curDel.element = null
      curDel.element = createDel(newDel)
      parentDel.element.insertChildAtIndex(curDel.element, curDel.index)
      curDel.tag = newDel.tag
    } else {
      console.log('aaaaaaaaaaaaaaaaaa!')
    }
    // curDel.element.innerText = ''
    // TODO: !!!!!!!!
    // if (
    //   !_.isObject(curDel.props) &&
    //   !_.isArray(curDel.props) &&
    //   !_.isUndefined(curDel.props)
    // ) {
    //   curDel.element.innerHTML = curDel.element.innerHTML.replace(
    //     `${curDel.props}`,
    //     ''
    //   )
    // }
    // console.log(
    //   setTimeout(() => console.log(curDel.element.innerHTML), 0),
    //   'ccurDel.element.children',
    //   curDel.element.children,
    //   curDel.childs
    // )
    curDel.query = newDel.query
    // curDel.class = newDel.class
    // curDel.id = newDel.id
    // parentDel.childs.splice(curDel.index, 1)
    // if (newDel.childs && child.childs.length) {
    //   attachToDOM(child.childs)
    //   _.forEach(child.childs, child =>
    //     child.element.appendChild(child.element)
    //   )
    // }
    // curDel.childs.insert(child.index, child)
  }
  if (curDel.class !== newDel.class) {
    curDel.element.className = newDel.class
    curDel.class = newDel.class
  }
  removeRemovedChilds(curDel, curDel.childs, newDel.childs)
  addNewChilds(curDel, curDel.childs, newDel.childs)
  if (!_.isEqual(curDel.props, newDel.props)) {
    if (component && component.beforeRender) {
      component.beforeRender()
    }
    const element = curDel.element
    const newProps = newDel.props
    const prevProps = curDel.props
    if (_.isObject(newDel.props)) {
      if (!_.isEmpty(newProps) && !_.isEmpty(prevProps)) {
        addPropsToElement(element, getOnlyNewProps(newProps, prevProps))
        _.each(prevProps, (prevPropValue, propName) => {
          const newPropValue = newProps[propName]
          if (_.isUndefined(newPropValue) || _.isNull(newPropValue)) {
            prevProps[propName] = removePropFromElement(
              element,
              prevPropValue,
              propName
            )
          } else {
            if (typeof newPropValue === 'function') {
              element[propName.toLowerCase()] = newPropValue
            } else if (newPropValue !== prevPropValue) {
              if (propName === 'value' && element.innerText !== newPropValue) {
                prevProps[propName] = element.innerText = newPropValue
              } else {
                element.setAttribute(propName, newPropValue)
                prevProps[propName] = newPropValue
              }
            }
          }
        })
      } else if (!_.isEmpty(newProps) && _.isEmpty(prevProps)) {
        addPropsToElement(element, getOnlyNewProps(newProps, prevProps))
        curDel.props = { ...newProps }
      }
    } else {
      const noChilds = !_.get(newDel.childs, 'length')
      const newValue = newProps
      const { tag } = newDel
      if (_.isUndefined(newValue) || _.isNull(newValue) || !newValue.length) {
        if (
          (tag === 'input' || tag === 'textarea') &&
          element.value !== newValue
        ) {
          element.value = ''
        } else if (tag === 'img') {
          element.src = ''
        } else if (noChilds) {
          element.innerHTML = ''
        }
        if (curDel && noChilds) {
          curDel.props = ''
        }
      } else {
        if (
          (tag === 'input' || tag === 'textarea') &&
          element.value !== newValue
        ) {
          element.value = newValue
        } else if (tag === 'img') {
          element.src = newValue
        } else {
          element.innerHTML = `<!-- uid-${
            newDel.uid
          }-text --> ${newValue} <!-- uid-${newDel.uid}-text -->`
        }
        if (curDel) {
          curDel.props = newValue
        }
      }
    }
    if (component && component.postRender) {
      component.postRender()
    }
  }
  if (curDel.childs) {
    const removeChild = (child, index) => {
      if (child.element !== null) {
        curDel.element.removeChild(child.element)
        child.element = null
      }
      curDel.childs.splice(index, 1)
    }
    for (let x = 0; x < curDel.childs.length; x++) {
      const curDelChild = curDel.childs[x]
      if (newDel.childs === undefined) {
        removeChild(curDelChild, x)
      } else {
        if (newDel.childs[x] === undefined) {
          removeChild(curDelChild, x)
        } else {
          if (
            curDelChild.component &&
            (newDel.childs[x] && newDel.childs[x].component)
          ) {
            if (newDel.childs[x].query !== curDelChild.query) {
              const newDelChild = newDel.childs[x]
              compareDels(
                curDelChild,
                createPel(
                  newDelChild.component.render(),
                  newDelChild.index,
                  newDelChild.component,
                  curDel.uid
                ),
                newDelChild.component,
                curDel
              )
            } else {
              updateComponent(
                curDelChild,
                newDel.childs[x].component,
                curDel.uid,
                curDel
              )
            }
          } else {
            compareDels(curDelChild, newDel.childs[x], null, curDel)
          }
        }
      }
    }
  }
}

const updateComponent = (dEl, component, parentUid, parentDel) => {
  const stateUpdated = !_.isEqual(dEl.component.state, component.state)
  const propsUpdated = !_.isEqual(dEl.component.props, component.props)
  if (stateUpdated) {
    dEl.component.state = _.clone(component.state)
  }
  if (propsUpdated) {
    dEl.component.props = _.clone(component.props)
  }

  if (stateUpdated || propsUpdated) {
    const newDel = createPel(
      component.render(),
      dEl.index,
      component,
      parentUid
    )
    compareDels(dEl, newDel, component, parentDel)
  }
}

const createComponentWatcher = (del, component, parentUid, parentDel) => {
  let updaterTimer = null

  const rawUpdate = component.setState

  component.setState = stateData => {
    const shouldUpdate = rawUpdate(stateData)
    if (shouldUpdate) {
      clearTimeout(updaterTimer)
      updaterTimer = setTimeout(() => {
        updaterTimer = null
        updateComponent(del, component, parentUid, parentDel)
      }, component.rerenderTimer)
    }
  }
}

const convertPelToDel = (pEl, index, parentUid, parentDel) => {
  const { query, props } = pEl
  let del
  if (_.isObject(query)) {
    const component = Prometey(query, props)
    let componentPEl = component.render()
    del = createPel(componentPEl, index, component, parentUid)
    createComponentWatcher(del, component, parentUid, parentDel)
  } else {
    del = createPel(pEl, index, null, parentUid)
  }
  return del
}

const generateUid = (pEl, index, parentUid) => {
  return `${_.last(_.chunk(parentUid, 10)).join('')}${pEl.tag}${index}`
}

export const createTree = (pEls, parentUid = 'zero', parentDel) => {
  let dEls
  if (_.isArray(pEls)) {
    dEls = _.map(pEls, (pEl, index) => {
      return convertPelToDel(pEl, index, parentUid, parentDel)
    })
  } else {
    dEls = [convertPelToDel(pEls, 0, parentUid, parentDel)]
  }
  return dEls
}

export const createElement = (query, props) => {
  return {
    query,
    props,
  }
}
