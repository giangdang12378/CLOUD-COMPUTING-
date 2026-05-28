import { motion } from "framer-motion";
import Input from "../components/Input";
import { Loader, Lock, Mail, User, Store, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";

import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

const RegisterStoreSchema = Yup.object().shape({
    storeName: Yup.string().required("Store Name is required"),
    name: Yup.string().required("Full Name is required"),
    phone: Yup.string().required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    email: Yup.string()
        .trim()
        .email("Invalid email format")
        .matches(/^\S*$/, "No spaces allowed")
        .required("Email is required"),
    password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .matches(/^\S*$/, "No spaces allowed")
        .required("Password is required"),
});

const RegisterStorePage = () => {
    const navigate = useNavigate();
    const { registerTenant, error, isLoading } = useAuthStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
        >
            <div className='p-8'>
                <div className="flex flex-col items-center mb-4">
                    <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
                        Register a New Store
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm text-center">
                        Create your own space and start selling today!
                    </p>
                </div>

                <Formik
                    initialValues={{ storeName: "", name: "", email: "", password: "", phone: "", address: "" }}
                    validationSchema={RegisterStoreSchema}
                    onSubmit={async (values) => {
                        try {
                            await registerTenant(values.storeName, values.name, values.email, values.password, values.phone, values.address);
                            navigate("/verify-email");
                        } catch (err) {
                            console.log(err);
                        }
                    }}
                >
                    {({ values, handleChange }) => (
                        <Form>
                            <Input
                                icon={Store}
                                type="text"
                                placeholder="Store Name"
                                value={values.storeName}
                                onChange={handleChange("storeName")}
                            />
                            <ErrorMessage name="storeName" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <Input
                                icon={User}
                                type="text"
                                placeholder="Owner's Full Name"
                                value={values.name}
                                onChange={handleChange("name")}
                            />
                            <ErrorMessage name="name" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <Input
                                icon={Mail}
                                type="email"
                                placeholder="Email Address"
                                value={values.email}
                                onChange={handleChange("email")}
                            />
                            <ErrorMessage name="email" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <Input
                                icon={Phone}
                                type="text"
                                placeholder="Phone Number"
                                value={values.phone}
                                onChange={handleChange("phone")}
                            />
                            <ErrorMessage name="phone" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <Input
                                icon={MapPin}
                                type="text"
                                placeholder="Address"
                                value={values.address}
                                onChange={handleChange("address")}
                            />
                            <ErrorMessage name="address" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <Input
                                icon={Lock}
                                type="password"
                                placeholder="Password"
                                value={values.password}
                                onChange={handleChange("password")}
                            />
                            <ErrorMessage name="password" component="p" className="text-red-500 mt-1 text-sm mb-2" />

                            <PasswordStrengthMeter password={values.password} />
                            {error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

                            <motion.button
                                className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                                font-bold rounded-lg shadow-lg hover:from-blue-600
                                hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                focus:ring-offset-gray-900 transition duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader className=" animate-spin mx-auto" size={24} /> : "Create Store"}
                            </motion.button>
                        </Form>
                    )}
                </Formik>

            </div>
            <div className='px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center'>
                <p className='text-sm text-gray-400'>
                    Already have a store?{" "}
                    <Link to={"/login"} className='text-blue-400 hover:underline'>
                        Login
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};
export default RegisterStorePage;
