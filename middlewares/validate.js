const { ZodError } = require('zod');

function validate (schema) {
    return (request, response, next) => {
        try {
            request.body = schema.parse(request.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return response.status(400).json(
                    {
                        error: "Validation error",
                        issues: error.issues.map(i => ({ path: i.path.join("."), message: i.message })),
                    }
                );
            }
            next(error);
        }
    }
}

module.exports = { validate };