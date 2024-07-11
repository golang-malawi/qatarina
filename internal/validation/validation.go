package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type ErrorResponse struct {
	FailedField string
	Tag         string
	Value       string
}

type validationErrors []ErrorResponse

func ValidateStruct(data any) validationErrors {
	var errors []ErrorResponse
	err := validate.Struct(data)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			var element ErrorResponse
			element.FailedField = err.StructNamespace()
			element.Tag = err.Tag()
			element.Value = err.Param()
			errors = append(errors, element)
		}
	}
	return errors
}

func (v validationErrors) Error() string {
	arr := make([]string, 0)
	for _, entry := range v {
		arr = append(arr, fmt.Sprintf("%s: %s", entry.FailedField, entry.Tag))
	}

	return strings.Join(arr, ",")
}
