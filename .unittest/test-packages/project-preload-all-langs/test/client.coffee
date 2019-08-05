Tinytest.addAsync 'project preload all langs - cc-CC preloads correctly.', (test, onComplete) ->
  TAPi18n.setLanguage "cc-CC"

  test.equal Blaze.toHTML(Template.project__preload_all_langs__basic_template), "C01, n05, n10, n100"
  test.equal Blaze.toHTML(Template.project__preload_all_langs__templates_introduced_by_packages), "C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100 C00, C01, Cx2, n100 C00, C01, Cx2, n100 n101"
  test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "C01, n05, n10, n100"
