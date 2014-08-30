share.render = (template) ->
  div = document.createElement("DIV")
  UI.insert(UI.render(template), div)
  div.innerHTML
