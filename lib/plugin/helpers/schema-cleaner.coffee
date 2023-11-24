_.extend share.helpers,
  buildCleanerForSchema: (schema, human_readable_reference="Obj") ->
    return (obj_to_clean) ->
      # Cleans in-place (!)

      try
        check obj_to_clean, Object
      catch e
        throw new Error "#{human_readable_reference} has to be an Object"

      # Remove not supported fields
      for key of obj_to_clean
        if key not of schema
          delete obj_to_clean[key]

      # Apply default values
      for key, key_def of schema
        if not (obj_to_clean[key])?
          if (default_value = key_def.defaultValue)?
            obj_to_clean[key] = default_value

      # Check types
      for key, val of obj_to_clean
        try
          check val, schema[key].type
        catch e
          throw new Error "The field #{key} of #{human_readable_reference} has to be of type: #{schema[key].type}"

      return obj_to_clean