Element.prototype.insertChildAtIndex = function(child, index) {
  console.log('indexindexindexindex', index)
  if (!index) index = 0
  if (index >= this.children.length) {
    this.appendChild(child)
  } else {
    this.insertBefore(child, this.children[index])
  }
}
