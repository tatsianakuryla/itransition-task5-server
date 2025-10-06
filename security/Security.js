const bcrypt = require("bcryptjs");

class Security {
    static async hashPassword(plain) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(plain, salt);
    }

    static async verifyPassword(plain, hash) {
        return bcrypt.compare(plain, hash);
    }
}

module.exports = { Security };