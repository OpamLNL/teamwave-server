const contactRepository = require('../repositories/contactRepository');

const createMessage = async (data) => {
    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();

    if (!name) {
        throw new Error('Вкажіть імʼя');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Некоректний email');
    }

    if (!message || message.length < 10) {
        throw new Error('Повідомлення занадто коротке (мінімум 10 символів)');
    }

    if (message.length > 5000) {
        throw new Error('Повідомлення занадто довге');
    }

    return await contactRepository.createMessage({ name, email, message });
};

module.exports = {
    createMessage,
};
